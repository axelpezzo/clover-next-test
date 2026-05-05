/* eslint-disable no-console */
const Company = require('../../models/company');
const User = require('../../models/user');
require('../connect');

module.exports.up = async () => {
  const company = await new Company({
    name: 'MebLabs',
    lang: 'EN',
    type: 'demo'
  }).save();

  const user = new User({
    email: 'test@meblabs.com',
    name: 'Test',
    lastname: 'User',
    lang: 'IT',
    active: true,
    roles: [],
    company: {
      id: company._id,
      name: company.name,
      type: company.type,
      roles: ['admin']
    }
  });

  user.password = 'testtest';

  return user.save();
};

module.exports.down = async () => {
  const user = await User.findOne({ email: 'test@meblabs.com' });
  if (user?.company?.id) await Company.deleteOne({ _id: user.company.id });
  return User.deleteOne({ email: 'test@meblabs.com' });
};
