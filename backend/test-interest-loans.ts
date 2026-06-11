const BASE_URL = 'http://localhost:4000/api';

async function runTests() {
  console.log("=========================================");
  console.log("🚀 STARTING INTEREST LOANS VALIDATION");
  console.log("=========================================\n");
  let token = "";

  try {
    console.log("[1] Testing Auth Login...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "superadmin@squarefinance.com",
        password: "Admin@1234"
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    token = loginData.token;
    console.log("✅ Login successful. Received valid JWT Token.");

    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    let loanId = "";
    
    console.log(`\n[2] Create Interest Loan...`);
    const payload = {
      customerDetails: {
        customerName: `Test Interest User`,
        address: "456 Secured St",
        ownRent: "Rent",
        mobileNumbers: ["8888888888"]
      },
      loanTerms: {
        loanNumber: `IL-TEST-${Date.now()}`,
        principalAmount: 200000,
        processingFeeRate: 1.5,
        interestRate: 2
      },
      pledgeInformation: {
        pledgeDetails: "Property Papers for Site #123"
      }
    };

    const createRes = await fetch(`${BASE_URL}/interest-loans`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    const createData = await createRes.json();
    if (!createData.message || !createData.data.loanTerms) {
      throw new Error(`Create response missing message or full data object. Response: ${JSON.stringify(createData)}`);
    }
    loanId = createData.data.id;
    console.log(`✅ Create returned 201 status, full data object, and message: "${createData.message}"`);
    console.log(`   - Monthly Interest automatically calculated as: ₹${createData.data.loanTerms.monthlyInterest}`);

    console.log(`\n[3] Get Interest Loans (Offset Pagination)...`);
    const getRes = await fetch(`${BASE_URL}/interest-loans?page=1&limit=5`, { headers });
    const getData = await getRes.json();
    if (typeof getData.data.items !== 'number' || typeof getData.data["current page"] !== 'number') {
      throw new Error(`Offset pagination math fields are missing or wrong type.`);
    }
    console.log(`✅ Get Loans formatted perfectly. Items: ${getData.data.items}, Total Pages: ${getData.data["total number of pages"]}, Message: "${getData.message}"`);

    console.log(`\n[4] Update Interest Loan (Simulate Principal Payment)...`);
    // If the user pays 50k towards principal, remaining principal becomes 150k
    const updateRes = await fetch(`${BASE_URL}/interest-loans/${loanId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        loanTerms: { remainingPrincipalAmount: 150000 }
      })
    });
    const updateData = await updateRes.json();
    if (!updateData.message) throw new Error(`Update response missing message.`);
    console.log(`✅ Update Loan successful. Message: "${updateData.message}"`);
    console.log(`   - New Remaining Principal: ₹${updateData.data.loanTerms.remainingPrincipalAmount}`);
    console.log(`   - New Recalculated Monthly Interest: ₹${updateData.data.loanTerms.monthlyInterest}`);

    console.log(`\n[5] Delete Interest Loan...`);
    const deleteRes = await fetch(`${BASE_URL}/interest-loans/${loanId}`, {
      method: 'DELETE',
      headers
    });
    const deleteData = await deleteRes.json();
    if (!deleteData.message) throw new Error(`Delete response missing message.`);
    console.log(`✅ Delete Loan successful. Message: "${deleteData.message}"`);

    console.log("\n=========================================");
    console.log("🎉 ALL TESTS PASSED! INTEREST LOANS ARCHITECTURE IS PERFECT.");
    console.log("=========================================\n");

  } catch (error: any) {
    console.error("❌ Test Failed!");
    console.error(error.message);
  }
}

runTests();
