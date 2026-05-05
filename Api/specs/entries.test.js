const supertest = require('supertest');

const app = require('../app');
const db = require('../db/connect-test');
const Company = require('../models/company');
const Entry = require('../models/entry');
const User = require('../models/user');
const { genereteAuthToken } = require('../helpers/auth');

const agent = supertest.agent(app);

let company1;
let company2;
let admin;
let adminToken;
let userToken;
let incomeEntry;
let expenseEntry;
let otherCompanyEntry;

beforeAll(async () => await db.connect());
beforeEach(async () => {
  await db.clear();

  company1 = await new Company({
    name: 'Company1',
    pic: 'companypic',
    lang: 'EN',
    zipcode: '12345',
    country: 'IT',
    address: 'Via XYZ 123',
    phone: { prefix: '+39', number: '1234567890', country: 'IT' },
    type: 'type1',
    vatNumber: 'IT1234567890'
  }).save();

  company2 = await new Company({
    name: 'Company2',
    pic: 'companypic2',
    lang: 'EN',
    zipcode: '12345',
    country: 'IT',
    address: 'Via XYZ 123',
    phone: { prefix: '+39', number: '1234567890', country: 'IT' },
    type: 'type2',
    vatNumber: 'IT1234567891'
  }).save();

  admin = await new User({
    email: 'admin@company1.com',
    password: 'testtest',
    name: 'Admin',
    lastname: 'User',
    lang: 'EN',
    active: true,
    company: {
      id: company1.id,
      name: 'Company1',
      type: 'type1',
      roles: ['admin']
    }
  }).save();

  const user = await new User({
    email: 'user@company1.com',
    password: 'testtest',
    name: 'User',
    lastname: 'User',
    lang: 'EN',
    active: true,
    company: {
      id: company1.id,
      name: 'Company1',
      type: 'type1',
      roles: ['user']
    }
  }).save();

  adminToken = genereteAuthToken(admin).token;
  userToken = genereteAuthToken(user).token;

  incomeEntry = await new Entry({
    type: 'income',
    company: { id: company1.id, name: company1.name },
    amount: 1200,
    date: new Date('2026-05-01'),
    category: 'Sales',
    description: 'Invoice payment',
    createdBy: { id: admin.id, fullname: admin.fullname }
  }).save();

  expenseEntry = await new Entry({
    type: 'expense',
    company: { id: company1.id, name: company1.name },
    amount: 80.5,
    date: new Date('2026-05-02'),
    category: 'Office',
    description: 'Paper',
    createdBy: { id: admin.id, fullname: admin.fullname }
  }).save();

  otherCompanyEntry = await new Entry({
    type: 'expense',
    company: { id: company2.id, name: company2.name },
    amount: 200,
    date: new Date('2026-05-03'),
    category: 'Travel',
    description: 'Train',
    createdBy: { id: admin.id, fullname: admin.fullname }
  }).save();
});
afterEach(() => jest.clearAllMocks());
afterAll(async () => await db.close());

describe('Entries API', () => {
  describe('GET /companies/:id/entries', () => {
    test('Get company entries', () =>
      agent
        .get(`/companies/${company1.id}/entries?sorter=date`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual([
            {
              _id: incomeEntry.id,
              type: 'income',
              amount: 1200,
              date: expect.any(String),
              category: 'Sales',
              description: 'Invoice payment',
              createdAt: expect.any(String)
            },
            {
              _id: expenseEntry.id,
              type: 'expense',
              amount: 80.5,
              date: expect.any(String),
              category: 'Office',
              description: 'Paper',
              createdAt: expect.any(String)
            }
          ])
        ));

    test('Get company entries filtered by category', () =>
      agent
        .get(`/companies/${company1.id}/entries?filter=office`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual([
            {
              _id: expenseEntry.id,
              type: 'expense',
              amount: 80.5,
              date: expect.any(String),
              category: 'Office',
              description: 'Paper',
              createdAt: expect.any(String)
            }
          ])
        ));

    test('Requires auth', () =>
      agent
        .get(`/companies/${company1.id}/entries`)
        .expect(401)
        .then(res =>
          expect(res.body).toStrictEqual({
            error: 401,
            message: 'Unauthorized',
            data: {}
          })
        ));
  });

  describe('POST /companies/:id/entries', () => {
    test('Create an entry', () =>
      agent
        .post(`/companies/${company1.id}/entries`)
        .set('Cookie', `accessToken=${userToken}`)
        .send({
          type: 'income',
          amount: 450.75,
          date: '2026-05-04',
          category: 'Consulting',
          description: 'May work'
        })
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual({
            _id: expect.any(String),
            type: 'income',
            company: { id: company1.id, name: 'Company1' },
            amount: 450.75,
            date: expect.any(String),
            category: 'Consulting',
            description: 'May work',
            createdBy: { id: expect.any(String), fullname: 'User User' },
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          })
        ));

    test('Validate entry type', () =>
      agent
        .post(`/companies/${company1.id}/entries`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          type: 'transfer',
          amount: 450.75,
          date: '2026-05-04',
          category: 'Consulting'
        })
        .expect(400)
        .then(res =>
          expect(res.body).toStrictEqual({
            error: 200,
            message: 'Validation error',
            data: '/type'
          })
        ));

    test('Validate positive amount', () =>
      agent
        .post(`/companies/${company1.id}/entries`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          type: 'expense',
          amount: 0,
          date: '2026-05-04',
          category: 'Office'
        })
        .expect(400)
        .then(res =>
          expect(res.body).toStrictEqual({
            error: 200,
            message: 'Validation error',
            data: '/amount'
          })
        ));
  });

  describe('GET /companies/:id/entries/:id', () => {
    test('Get entry detail', () =>
      agent
        .get(`/companies/${company1.id}/entries/${incomeEntry.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual({
            _id: incomeEntry.id,
            type: 'income',
            company: { id: company1.id, name: 'Company1' },
            amount: 1200,
            date: expect.any(String),
            category: 'Sales',
            description: 'Invoice payment',
            createdBy: { id: admin.id, fullname: 'Admin User' },
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          })
        ));

    test('Does not return entries from another company', () =>
      agent
        .get(`/companies/${company1.id}/entries/${otherCompanyEntry.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(404)
        .then(res =>
          expect(res.body).toStrictEqual({
            error: 404,
            message: 'Not found',
            data: {}
          })
        ));
  });

  describe('PATCH /companies/:id/entries/:id', () => {
    test('Update an entry', () =>
      agent
        .patch(`/companies/${company1.id}/entries/${expenseEntry.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ amount: 95, category: 'Supplies' })
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual({
            _id: expenseEntry.id,
            type: 'expense',
            company: { id: company1.id, name: 'Company1' },
            amount: 95,
            date: expect.any(String),
            category: 'Supplies',
            description: 'Paper',
            createdBy: { id: admin.id, fullname: 'Admin User' },
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          })
        ));
  });

  describe('DELETE /companies/:id/entries/:id', () => {
    test('Delete an entry', () =>
      agent
        .delete(`/companies/${company1.id}/entries/${expenseEntry.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200)
        .then(res => {
          expect(res.body).toStrictEqual({ message: 'Entry deleted successfully' });

          return agent
            .get(`/companies/${company1.id}/entries/${expenseEntry.id}`)
            .set('Cookie', `accessToken=${adminToken}`)
            .expect(404);
        }));
  });
});
