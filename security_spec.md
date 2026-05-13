# Security Specification - Sabor & Gestão

## Data Invariants
1. Products must have a name, category, and valid prices.
2. Transactions must have a type (income/expense), a positive amount, and a date.
3. Stock levels can be negative in some cases (oversell) but should generally be tracked.
4. Users must be authenticated to access any data.

## The "Dirty Dozen" Payloads (intended to fail)
1. **Unauthenticated Read**: Try to read `/products` without a token.
2. **Identity Spoofing**: Try to set a `userId` field to another user (not implemented yet as global ownership isn't strictly requested, but good practice).
3. **Negative Price**: Create a product with `sellingPrice: -10`.
4. **Invalid Type**: Set `transaction.amount` to a string `"100"`.
5. **Shadow Field**: Add `isAdmin: true` to a product document.
6. **ID Poisoning**: Use a document ID that is 2KB long.
7. **Orphaned Transaction**: Create a transaction for a non-existent `productId` (logical invariant, though rules might not check existence if not requested, but I should try).
8. **Malicious Regex**: Use a name with script tags `<script>window.location='...'</script>`.
9. **State Shortcut**: Update a transaction and change its `type` from `income` to `expense`.
10. **Resource Exhaustion**: Send an array of 10,000 tags in a product.
11. **Future Dating**: Set `transaction.date` to the year 3000 (if I can validate date format).
12. **Blanket List**: Try to list all products without being signed in.

## Test Runner (Draft)
I will implement `firestore.rules.test.ts` after drafting the rules.
