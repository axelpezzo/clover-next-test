const Entry = require('../models/entry');
const { intersection } = require('../helpers/utils');

const entryRbac = async (caller, resourceId, companyId, { authorizedRoles = [] }) => {
  const entry = await Entry.findById(resourceId);
  if (!entry) return null;

  if (companyId && entry.company?.id?.toString() !== companyId?.toString()) return null;

  const { grants, company = {}, roles: globalRoles = [] } = caller;
  const { roles: companyRoles = [] } = company;
  const roles = Array.from(new Set([...companyRoles, ...globalRoles]));

  if (grants?.type === 'any' || roles.includes('superuser')) return entry;
  if (intersection(authorizedRoles, roles).length && company?.id?.toString() === entry.company?.id?.toString())
    return entry;

  return false;
};

module.exports.canGetEntry = (caller, resourceId, companyId) =>
  entryRbac(caller, resourceId, companyId, { authorizedRoles: ['admin', 'user'] });

module.exports.canUpdateEntry = (caller, resourceId, companyId) =>
  entryRbac(caller, resourceId, companyId, { authorizedRoles: ['admin', 'user'] });

module.exports.canDeleteEntry = (caller, resourceId, companyId) =>
  entryRbac(caller, resourceId, companyId, { authorizedRoles: ['admin', 'user'] });
