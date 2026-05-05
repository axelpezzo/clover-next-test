const mongoose = require('mongoose');
const softDelete = require('../helpers/softDelete');
const dbFields = require('../helpers/dbFields');
const mongooseHistory = require('../helpers/mongooseHistory');

const { Schema } = mongoose;

const schema = Schema(
  {
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
      index: true
    },
    company: {
      _id: false,
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
      },
      name: {
        type: String,
        maxlength: 128,
        trim: true
      }
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      maxlength: 128,
      trim: true
    },
    description: {
      type: String,
      maxlength: 512,
      trim: true
    },
    createdBy: {
      _id: false,
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      fullname: {
        type: String,
        maxlength: 256,
        trim: true
      }
    }
  },
  {
    timestamps: true
  }
);

schema.plugin(softDelete);
schema.plugin(dbFields, {
  fields: {
    public: ['_id', 'type', 'amount', 'date', 'category', 'description', 'createdAt'],
    listing: ['_id', 'type', 'amount', 'date', 'category', 'description', 'createdAt'],
    cp: ['_id', 'type', 'company', 'amount', 'date', 'category', 'description', 'createdBy', 'updatedAt', 'createdAt']
  }
});

schema.plugin(
  mongooseHistory({
    mongoose,
    modelName: 'entries_h',
    userCollection: 'User',
    accountCollection: 'Company',
    userFieldName: 'user',
    accountFieldName: 'company',
    noDiffSaveOnMethods: []
  })
);

module.exports = mongoose.models.Entry || mongoose.model('Entry', schema);
