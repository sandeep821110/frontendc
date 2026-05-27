# Address Fix TODO

## Issues Found:
1. **Phone validation error key mismatch in Address.jsx**: `validateForm` stored phone error as `errors.phone` but the field name is `phoneNumber`, so errors never cleared on input.
2. **Overly restrictive submit button in Address.jsx**: `disabled={submitting || pincodeStatus !== 'success'}` blocked users from saving addresses when pincode API was down.
3. **Selected address not sent to backend during checkout**: `buyNow` in cartSlice.js only received cart items, not the delivery address. CheckOut.jsx captured `selectedAddress` but never passed it to the API.

## Steps:
- [x] 1. Fix phone validation error key in `src/components/pages/Address.jsx`
- [x] 2. Fix InputField error prop for phone in `src/components/pages/Address.jsx`
- [x] 3. Remove pincode-status block from submit button in `src/components/pages/Address.jsx`
- [x] 4. Update `buyNow` thunk in `src/features/cart/cartSlice.js` to accept `{ items, address }`
- [x] 5. Update `buyNow` dispatch in `src/components/pages/CheckOut.jsx` to pass the selected address
- [x] 6. Verify integration (AddressSelector already integrated in CheckOut.jsx)

