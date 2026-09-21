const Customer = require('../models/Customer');

exports.getCustomers = async (req, res) => {
  try { res.json(await Customer.find().sort({ name: 1 }).lean()); } 
  catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
};

// Trims the name and requires a 10-digit mobile; returns an error string or null.
const validateCustomer = (body) => {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const mobile = typeof body.mobile === 'string' ? body.mobile.trim() : '';
  if (!name) return { error: 'Name is required' };
  if (!/^\d{10}$/.test(mobile)) return { error: 'Mobile must be exactly 10 digits' };
  return { name, mobile };
};

exports.createCustomer = async (req, res) => {
  try {
    const v = validateCustomer(req.body);
    if (v.error) return res.status(400).json({ error: v.error });
    const { name, mobile } = v;
    let existing = await Customer.findOne({ mobile });
    if (existing) {
      return res.status(400).json({ error: 'Customer already exists with this mobile number.' });
    }
    const c = new Customer({ name, mobile }); 
    await c.save();
    res.status(201).json(c);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.updateCustomer = async (req, res) => {
    try {
      const v = validateCustomer(req.body);
      if (v.error) return res.status(400).json({ error: v.error });
      const { name, mobile } = v;
      const c = await Customer.findByIdAndUpdate(req.params.id, { name, mobile }, { new: true });
      res.json(c);
    } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.deleteCustomer = async (req, res) => {
    try { await Customer.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
    catch (err) { res.status(400).json({ error: err.message }); }
};
