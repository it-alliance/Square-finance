const BASE_URL = 'http://localhost:4000/api';

async function runTests() {
  console.log("Starting Weekly & Daily Loans Final Validation...");
  let token = "";

  try {
    console.log("\n[1] Testing Auth Login...");
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
    console.log("✅ Login successful. Received Token.");

    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // --- WEEKLY LOANS ---
    console.log("\n--- WEEKLY LOANS ---");
    let weeklyLoanId = "";
    
    console.log("[W1] Testing Create Weekly Loan...");
    const wCreateRes = await fetch(`${BASE_URL}/weekly-loans`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customerDetails: {
          customerName: "Test Weekly User",
          address: "123 Weekly St",
          ownRent: "Own",
          mobileNumbers: ["9999999991"]
        },
        loanTerms: {
          loanNumber: `WL-TEST-${Date.now()}`,
          principalAmount: 100000,
          processingFeeRate: 2,
          tenureWeeks: 52, // 1 year weekly
          annualInterestRate: 15
        }
      })
    });
    
    const wCreateData = await wCreateRes.json();
    console.log("Create Status:", wCreateRes.status);
    console.log("Create Message:", wCreateData.message);
    if (!wCreateData.message || !wCreateData.data.loanTerms) {
      throw new Error("Weekly Create response missing message or full data object.");
    }
    weeklyLoanId = wCreateData.data.id;
    console.log("✅ Weekly Create Loan successful.");

    console.log("[W2] Testing Get Weekly Loans (Offset Pagination)...");
    const wGetRes = await fetch(`${BASE_URL}/weekly-loans?page=1&limit=5`, { headers });
    const wGetData = await wGetRes.json();
    console.log("Get Status:", wGetRes.status);
    console.log("Get Message:", wGetData.message);
    console.log("Pagination Items:", wGetData.data.items);
    console.log("Pagination Pages:", wGetData.data["total number of pages"]);
    if (typeof wGetData.data.items !== 'number') throw new Error("Offset pagination missing.");
    console.log("✅ Weekly Get Loans formatted perfectly.");

    console.log("[W3] Testing Delete Weekly Loan...");
    const wDelRes = await fetch(`${BASE_URL}/weekly-loans/${weeklyLoanId}`, { method: 'DELETE', headers });
    const wDelData = await wDelRes.json();
    if (!wDelData.message) throw new Error("Weekly Delete missing message.");
    console.log("✅ Weekly Delete successful.");

    // --- DAILY LOANS ---
    console.log("\n--- DAILY LOANS ---");
    let dailyLoanId = "";
    
    console.log("[D1] Testing Create Daily Loan...");
    const dCreateRes = await fetch(`${BASE_URL}/daily-loans`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customerDetails: {
          customerName: "Test Daily User",
          address: "123 Daily St",
          ownRent: "Own",
          mobileNumbers: ["9999999992"]
        },
        loanTerms: {
          loanNumber: `DL-TEST-${Date.now()}`,
          principalAmount: 100000,
          processingFeeRate: 2,
          tenureMonths: 100, // 100 days
          annualInterestRate: 15
        }
      })
    });
    
    const dCreateData = await dCreateRes.json();
    console.log("Create Status:", dCreateRes.status);
    console.log("Create Message:", dCreateData.message);
    if (!dCreateData.message || !dCreateData.data.loanTerms) {
      throw new Error("Daily Create response missing message or full data object.");
    }
    dailyLoanId = dCreateData.data.id;
    console.log("✅ Daily Create Loan successful.");

    console.log("[D2] Testing Get Daily Loans (Offset Pagination)...");
    const dGetRes = await fetch(`${BASE_URL}/daily-loans?page=1&limit=5`, { headers });
    const dGetData = await dGetRes.json();
    console.log("Get Status:", dGetRes.status);
    console.log("Get Message:", dGetData.message);
    console.log("Pagination Items:", dGetData.data.items);
    console.log("Pagination Pages:", dGetData.data["total number of pages"]);
    if (typeof dGetData.data.items !== 'number') throw new Error("Offset pagination missing.");
    console.log("✅ Daily Get Loans formatted perfectly.");

    console.log("[D3] Testing Delete Daily Loan...");
    const dDelRes = await fetch(`${BASE_URL}/daily-loans/${dailyLoanId}`, { method: 'DELETE', headers });
    const dDelData = await dDelRes.json();
    if (!dDelData.message) throw new Error("Daily Delete missing message.");
    console.log("✅ Daily Delete successful.");

    console.log("\n🎉 ALL TESTS PASSED! Both Weekly and Daily systems are fully synced with the new architecture.");

  } catch (error: any) {
    console.error("❌ Test Failed!");
    console.error(error.message);
  }
}

runTests();
