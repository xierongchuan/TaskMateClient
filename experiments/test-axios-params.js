// Test script to understand how axios handles empty parameters

// Simulate the filters object from TasksPage
const filters = {
  search: '',
  status: '',
  recurrence: '',
  task_type: '',
  response_type: '',
  date_range: 'all',
  dealership_id: null,
  tags: [],
};

// Simulate what happens when first dealership is selected (id: 1)
const filtersWithFirstDealership = {
  ...filters,
  dealership_id: 1,
};

// Simulate what happens when dealership_id || undefined is used
const filtersWithUndefined = {
  ...filters,
  dealership_id: filters.dealership_id || undefined,
};

console.log('=== Original filters ===');
console.log(JSON.stringify(filters, null, 2));

console.log('\n=== Filters with first dealership (id: 1) ===');
console.log(JSON.stringify(filtersWithFirstDealership, null, 2));

console.log('\n=== Filters with dealership_id || undefined ===');
console.log(JSON.stringify(filtersWithUndefined, null, 2));

// Create a mock request to see what URL would be generated
const testUrl = 'http://localhost:8000/api/v1/tasks';

console.log('\n=== Testing URL generation ===');

// Test with axios URLSearchParams
const params1 = new URLSearchParams();
Object.entries(filters).forEach(([key, value]) => {
  if (value !== null && value !== undefined && value !== '') {
    if (Array.isArray(value)) {
      value.forEach(v => params1.append(key, v));
    } else {
      params1.append(key, value.toString());
    }
  }
});

console.log('URL with filtered params:', `${testUrl}?${params1.toString()}`);

// Test with all params (including empty)
const params2 = new URLSearchParams();
Object.entries(filtersWithFirstDealership).forEach(([key, value]) => {
  if (value !== null && value !== undefined) {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        value.forEach(v => params2.append(key, v));
      }
    } else {
      params2.append(key, value.toString());
    }
  }
});

console.log('URL with dealership_id=1 (filtered):', `${testUrl}?${params2.toString()}`);

// Test what axios actually sends
console.log('\n=== What axios would send (raw params) ===');
console.log('With empty strings:', filtersWithFirstDealership);

// Helper function to clean params
function cleanParams(params) {
  const cleaned = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        cleaned[key] = value;
      } else if (!Array.isArray(value)) {
        cleaned[key] = value;
      }
    }
  });
  return cleaned;
}

console.log('\n=== Cleaned params ===');
console.log('Cleaned filters:', cleanParams(filtersWithFirstDealership));
