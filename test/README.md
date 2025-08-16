# Test Documentation

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm test -- test/utils.test.ts

# Run tests in watch mode
npm test -- --watch
```

## Test Structure

- `utils.test.ts` - Tests for utility functions (date parsing, commit message formatting)
- `prompt-manager.test.ts` - Tests for prompt file management and metadata handling
- `search.test.ts` - Tests for search and filtering functionality
- `pmc-manager.test.ts` - Integration tests for main PMC operations

## Test Coverage

The tests cover:

✅ **Core Functionality**
- Prompt parsing from Markdown
- System metadata management
- Search and filtering
- Basic CLI operations

✅ **Edge Cases**
- Missing files
- Invalid data formats
- Empty results

✅ **Integration**
- End-to-end command operations
- File system interactions

## Notes

- Tests use temporary directories to avoid affecting user data
- Git functionality is mocked/skipped in tests for simplicity
- Tests focus on core business logic rather than CLI formatting details