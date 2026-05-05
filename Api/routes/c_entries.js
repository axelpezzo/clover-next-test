const express = require('express');
const { isAuth } = require('../middlewares/isAuth');
const rbac = require('../middlewares/rbac');
const { validator } = require('../middlewares/validator');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(isAuth, rbac('entries', 'read'))
  .post(validator('createEntry'), isAuth, rbac('entries', 'create'));

router
  .route('/:id')
  .get(validator({ params: 'id' }), isAuth, rbac('entries', 'read'))
  .patch(validator({ params: 'id', body: 'updateEntry' }), isAuth, rbac('entries', 'update'))
  .delete(validator({ params: 'id' }), isAuth, rbac('entries', 'delete'));

module.exports = router;
