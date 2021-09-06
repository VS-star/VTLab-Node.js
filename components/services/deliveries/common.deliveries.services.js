/* eslint-disable quotes */
import Deliveries from '@/models/Deliveries.model';
import Products from '@/models/Products.model';

const find = async (req) => {
  // some vars
  let query = {};
  let limit = req.body.limit
    ? req.body.limit > 100
      ? 100
      : parseInt(req.body.limit)
    : 100;
  let skip = req.body.page
    ? (Math.max(0, parseInt(req.body.page)) - 1) * limit
    : 0;
  let sort = { _id: 1 };

  // if date provided, filter by date
  if (req.body.when) {
    query['when'] = {
      $gte: req.body.when,
    };
  }

  // query['products'] = { $elemMatch: { $eq: '6132779c4d09663cec23d516' } };

  let totalResults = await Deliveries.find(query).countDocuments();

  if (totalResults < 1) {
    throw {
      code: 404,
      data: {
        message: "We couldn't find any delivery",
      },
    };
  }

  let deliveries = await Deliveries.find(query)
    .skip(skip)
    .sort(sort)
    .limit(limit);

  return {
    totalResults: totalResults,
    deliveries,
  };
};

const create = async (req) => {
  try {
    await Deliveries.create(req.body);
  } catch (e) {
    throw {
      code: 400,
      data: {
        message: `An error has occurred trying to create the delivery:
          ${JSON.stringify(e, null, 2)}`,
      },
    };
  }
};

const filter = async (req) => {
  // some vars
  let limit = req.body.limit
    ? req.body.limit > 100
      ? 100
      : parseInt(req.body.limit)
    : 100;
  let skip = req.body.page
    ? (Math.max(0, parseInt(req.body.page)) - 1) * limit
    : 0;
  let sort = { _id: 1 };

  // fetch over weighted products
  let weight = req.body.weight ? Math.max(0, parseInt(req.body.weight)) : 0;
  let productsQuery = { weight: { $gte: weight } };
  let products = await Products.find(productsQuery).select('_id');

  // fetch deliveries
  let deliveriesQuery = {
    products: { $in: products },
  };

  if (req.body.dateFrom) deliveriesQuery.when = { $gte: req.body.dateFrom };
  if (req.body.dateTo)
    deliveriesQuery.when = { $lte: req.body.dateTo, ...deliveriesQuery.when };

  let totalResults = await Deliveries.find(deliveriesQuery).countDocuments();
  let deliveries = await Deliveries.find(deliveriesQuery)
    .skip(skip)
    .sort(sort)
    .limit(limit)
    .populate('products');
  if (totalResults < 1) {
    throw {
      code: 404,
      data: {
        message: "We couldn't find any delivery",
      },
    };
  }
  return { totalResults: totalResults, deliveries };
};

const findOne = async (req) => {
  let delivery = await Deliveries.findOne({ _id: req.body.id });
  if (!delivery) {
    throw {
      code: 404,
      data: {
        message: `We couldn't find a delivery with the sent ID`,
      },
    };
  }
  return delivery;
};

const edit = async (req) => {
  try {
    const filter = { _id: req.body._id };
    const options = { upsert: false };
    const updateDoc = {
      $set: {
        when: req.body.when,
        origin: req.body.origin,
        destination: req.body.destination,
        products: req.body.products,
      },
    };
    await Deliveries.updateOne(filter, updateDoc, options);
  } catch (e) {
    throw {
      code: 400,
      data: {
        message: `An error has occurred trying to create the delivery:
          ${JSON.stringify(e, null, 2)}`,
      },
    };
  }
};

export default {
  find,
  create,
  filter,
  findOne,
  edit,
};
