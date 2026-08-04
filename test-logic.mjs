/**
 * STANDALONE UNIT TESTS FOR BILLING LOGIC
 * Validates subtotals, discounts, and GST calculations.
 */

const calculateBill = ({ cart, discount, billType, taxRateSetting }) => {
  const taxRate = taxRateSetting / 100;
  const subt = cart.reduce((a, i) => a + i.sellingPrice * i.quantity, 0);
  const dValue = discount.type === 'percentage' ? (subt * discount.value / 100) : discount.value;
  const taxable = Math.max(0, subt - dValue);
  const gst = billType === 'GST' ? taxable * taxRate : 0;
  const totalAmount = taxable + gst;
  
  return { subt, dValue, taxable, gst, totalAmount: Math.round(totalAmount * 100) / 100 };
};

// --- Test Cases ---
const runTests = () => {
  let passed = 0;
  let failed = 0;

  const assert = (name, actual, expected) => {
    if (actual === expected) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}: Expected ${expected}, got ${actual}`);
      failed++;
    }
  };

  // 1. Basic GST Bill with Percentage Discount
  const test1 = calculateBill({
    cart: [{ sellingPrice: 1000, quantity: 2 }, { sellingPrice: 500, quantity: 1 }], // Subtotal: 2500
    discount: { type: 'percentage', value: 10 }, // 10% of 2500 = 250. Taxable: 2250
    billType: 'GST',
    taxRateSetting: 18 // 18% of 2250 = 405. Total: 2655
  });
  assert('Test 1: Subtotal', test1.subt, 2500);
  assert('Test 1: Total Amount', test1.totalAmount, 2655);

  // 2. Cash Bill (No GST) with Fixed Discount
  const test2 = calculateBill({
    cart: [{ sellingPrice: 1000, quantity: 1 }], // Subtotal: 1000
    discount: { type: 'fixed', value: 150 }, // Taxable: 850
    billType: 'CASH',
    taxRateSetting: 18 // No GST. Total: 850
  });
  assert('Test 2: Subtotal', test2.subt, 1000);
  assert('Test 2: Total Amount', test2.totalAmount, 850);

  // 3. Edge Case: 100% Discount
  const test3 = calculateBill({
    cart: [{ sellingPrice: 500, quantity: 1 }],
    discount: { type: 'percentage', value: 100 },
    billType: 'GST',
    taxRateSetting: 18
  });
  assert('Test 3: Total should be 0', test3.totalAmount, 0);

  console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
};

runTests();
