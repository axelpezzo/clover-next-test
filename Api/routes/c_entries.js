const express = require('express');
const controller = require('../controllers/entries');
const { isAuth } = require('../middlewares/isAuth');
const rbac = require('../middlewares/rbac');
const { validator } = require('../middlewares/validator');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(isAuth, rbac('entries', 'read'), controller.getByCompany)
  .post(validator('createEntry'), isAuth, rbac('entries', 'create'), controller.create);

router
  .route('/:id')
  .get(validator({ params: 'id' }), isAuth, rbac('entries', 'read'), controller.getById)
  .patch(validator({ params: 'id', body: 'updateEntry' }), isAuth, rbac('entries', 'update'), controller.update)
  .delete(validator({ params: 'id' }), isAuth, rbac('entries', 'delete'), controller.delete);

module.exports = router;
