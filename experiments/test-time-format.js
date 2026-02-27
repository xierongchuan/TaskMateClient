// Test script to verify recurrence_time format transformation
// This validates that the substring(0, 5) approach correctly converts HH:MM:SS to HH:MM

const testCases = [
  { input: "22:20:00", expected: "22:20" },
  { input: "09:00:00", expected: "09:00" },
  { input: "14:30:00", expected: "14:30" },
  { input: "00:00:00", expected: "00:00" },
  { input: "23:59:59", expected: "23:59" },
  // Edge cases
  { input: "22:20", expected: "22:20" }, // Already in correct format
  { input: "", expected: "" }, // Empty string
];

console.log("Testing recurrence_time format transformation\n");

let allPassed = true;

testCases.forEach((testCase, index) => {
  const result = testCase.input ? testCase.input.substring(0, 5) : testCase.input;
  const passed = result === testCase.expected;
  allPassed = allPassed && passed;

  console.log(`Test ${index + 1}: ${passed ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`  Input:    "${testCase.input}"`);
  console.log(`  Expected: "${testCase.expected}"`);
  console.log(`  Result:   "${result}"`);
  console.log();
});

console.log(allPassed ? "All tests passed! ✓" : "Some tests failed! ✗");
process.exit(allPassed ? 0 : 1);
