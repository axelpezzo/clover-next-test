const Entry = require('../models/entry');
const { SendData, ServerError, NotFound, Unauthorized } = require('../helpers/response');
const getter = require('../helpers/getter');
const { canGetEntry, canUpdateEntry, canDeleteEntry } = require('../rbac/entries');

const entryQuery = ({ filter }, companyId) => {
  const query = { 'company.id': companyId };

  if (filter) {
    query.$or = [{ category: new RegExp(filter, 'i') }, { description: new RegExp(filter, 'i') }];
  }

  return query;
};

module.exports.getByCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const query = entryQuery(req.query, companyId);
    const data = await getter(Entry, query, req, res);

    return next(SendData(data));
  } catch (err) {
    return next(ServerError(err));
  }
};

module.exports.create = async ({ body }, { locals: { company, user } }, next) => {
  try {
    const data = new Entry({
      ...body,
      company: {
        id: company.id,
        name: company.name
      },
      createdBy: {
        id: user.id,
        fullname: user.fullname
      }
    });

    data.__history = {
      event: 'create',
      method: 'create',
      user: user.id,
      company: company.id
    };

    await data.save();

    return next(SendData(data.response('cp')));
  } catch (err) {
    return next(ServerError(err));
  }
};

module.exports.getById = async ({ params: { companyId, id } }, { locals: { user } }, next) => {
  try {
    const targetEntry = await canGetEntry(user, id, companyId);
    if (targetEntry === null) return next(NotFound());
    if (!targetEntry) return next(Unauthorized());

    return next(SendData(targetEntry.response('cp')));
  } catch (err) {
    return next(ServerError(err));
  }
};

module.exports.update = async ({ params: { companyId, id }, body }, { locals: { user } }, next) => {
  try {
    const targetEntry = await canUpdateEntry(user, id, companyId);
    if (targetEntry === null) return next(NotFound());
    if (!targetEntry) return next(Unauthorized());

    const data = Object.assign(targetEntry, body);

    data.__history = {
      event: 'update',
      method: 'patch',
      user: user.id,
      company: targetEntry.company.id
    };

    await data.save();

    return next(SendData(targetEntry.response('cp')));
  } catch (err) {
    return next(ServerError(err));
  }
};

module.exports.delete = async ({ params: { companyId, id } }, { locals: { user } }, next) => {
  try {
    const targetEntry = await canDeleteEntry(user, id, companyId);
    if (targetEntry === null) return next(NotFound());
    if (!targetEntry) return next(Unauthorized());

    targetEntry.__history = {
      event: 'delete',
      method: 'delete',
      user: user.id,
      company: targetEntry.company.id
    };

    await targetEntry.softDelete();

    return next(SendData({ message: 'Entry deleted successfully' }));
  } catch (err) {
    return next(ServerError(err));
  }
};
