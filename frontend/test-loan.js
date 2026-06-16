const axios = require('axios');

async function runTest() {
  try {
    console.log("1. Testing Loan Creation with ONLY mandatory fields (loanNumber)...");
    const payload = {
      loanType: 'Monthly',
      loanTerms: {
        loanNumber: 'TEST-LOAN-999',
        tenureMonths: 12,
        principalAmount: 50000,
        annualInterestRate: 10
      },
      customerDetails: {
        customerName: '', // Empty optional field
        panNumber: ''
      },
      vehicleInformation: {
        vehicleNumber: 'RAW STRING NO REGEX 123 !@#'
      },
      status: {
        status: 'Active',
        remarks: 'Initial test remark',
        nextFollowUpDate: new Date(Date.now() + 86400000).toISOString()
      }
    };

    const createRes = await axios.post('http://localhost:4000/api/monthly-loans', payload);
    console.log("Create Response:", createRes.status, createRes.data.success);
    const loanId = createRes.data.data.id || createRes.data.data._id;
    console.log("Created Loan ID:", loanId);

    console.log("\n2. Simulating a Payment to test Collected Amount and Due Date...");
    // Add a payment
    await axios.post(`http://localhost:4000/api/monthly-loans/${loanId}/payments`, {
      amount: 5000,
      mode: 'Cash',
      date: new Date().toISOString()
    });
    console.log("Payment added.");

    console.log("\n3. Simulating a Follow Up...");
    await axios.post(`http://localhost:4000/api/monthly-loans/${loanId}/follow-up`, {
      employeeComment: 'Client said they will pay next week',
      promisedDate: new Date(Date.now() + 86400000 * 7).toISOString()
    });
    console.log("Follow up added.");

    console.log("\n4. Fetching the created loan to verify fields...");
    const getRes = await axios.get(`http://localhost:4000/api/monthly-loans/${loanId}`);
    const loanData = getRes.data.data;
    
    console.log("\n--- VERIFICATION RESULTS ---");
    console.log("Loan Number:", loanData.loanNumber);
    console.log("Vehicle Number Accepted (No Formatting):", loanData.vehicleNumber === 'RAW STRING NO REGEX 123 !@#' ? 'YES' : 'NO');
    console.log("FollowUps Array Exists & Has Items:", Array.isArray(loanData.followUps) && loanData.followUps.length > 0 ? 'YES' : 'NO');
    console.log("Payments Array Exists & Has Items:", Array.isArray(loanData.payments) && loanData.payments.length > 0 ? 'YES' : 'NO');
    console.log("UpdatedAt Timestamp Exists:", !!loanData.updatedAt ? 'YES' : 'NO');

  } catch (err) {
    console.error("Test failed:", err.response ? err.response.data : err.message);
  }
}

runTest();
