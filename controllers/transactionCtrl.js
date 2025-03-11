const asyncHandler = require("express-async-handler");
const Transaction = require("../model/Transaction");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Utility to convert dates to EST
const convertToEST = (date) => dayjs(date).tz("America/New_York").toDate();

const transactionController = {
  //! Add transaction
  create: asyncHandler(async (req, res) => {
    const { type, category, amount, date, description } = req.body;

    if (!amount || !type || !date) {
      throw new Error("Type, amount, and date are required");
    }

    const dateInEST = convertToEST(date); // Convert to EST
    const transaction = await Transaction.create({
      user: req.user,
      type,
      category,
      amount,
      description,
      date: dateInEST,
    });
    
    // Log the creation of the transaction
    console.log(`Created transaction: ${transaction._id}, Type: ${transaction.type}, Amount: $${transaction.amount}, Date: ${transaction.date}`);
    
    res.status(201).json(transaction);
  }),

  //! Get filtered transactions
  getFilteredTransactions: asyncHandler(async (req, res) => {
    const { startDate, endDate, type, category } = req.query;
    let filters = { user: req.user };

    if (startDate) {
      filters.date = { ...filters.date, $gte: convertToEST(startDate) };
    }
    if (endDate) {
      filters.date = { ...filters.date, $lte: convertToEST(endDate) };
    }
    if (type) {
      filters.type = type;
    }
    if (category && category !== "All") {
      filters.category = category;
    }

    const transactions = await Transaction.find(filters).sort({ date: -1 });

    // Log the transaction fetching
    console.log(`Fetched ${transactions.length} transactions with filters:`, filters);

    res.json(transactions);
  }),

  //! Update transaction
  update: asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);

    if (transaction && transaction.user.toString() === req.user.toString()) {
      transaction.type = req.body.type || transaction.type;
      transaction.category = req.body.category || transaction.category;
      transaction.amount = req.body.amount || transaction.amount;
      transaction.date = req.body.date
        ? convertToEST(req.body.date)
        : transaction.date;
      transaction.description = req.body.description || transaction.description;

      const updatedTransaction = await transaction.save();

      // Log the update of the transaction
      console.log(`Updated transaction: ${updatedTransaction._id}, Type: ${updatedTransaction.type}, Amount: $${updatedTransaction.amount}, Date: ${updatedTransaction.date}`);

      res.json(updatedTransaction);
    } else {
      res.status(404).json({ message: "Transaction not found or unauthorized" });
    }
  }),

  //! Delete transaction
  delete: asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);

    if (transaction && transaction.user.toString() === req.user.toString()) {
      await Transaction.findByIdAndDelete(req.params.id);

      // Log the deletion of the transaction
      console.log(`Deleted transaction: ${req.params.id}`);

      res.json({ message: "Transaction removed" });
    } else {
      res.status(404).json({ message: "Transaction not found or unauthorized" });
    }
  }),
};

module.exports = transactionController;
