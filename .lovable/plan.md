

## Fix: Indian Phone Number Validation in Request Help Form

### Problem
The `pattern="[0-9]*"` attribute on the `<input>` element causes the browser's built-in validation to reject the displayed value because it contains a formatting space (e.g., `"70105 19553"`). This triggers the browser's default "Please match the requested format" tooltip, blocking form submission even with a valid number.

### Solution
Edit `src/components/IndianPhoneInput.tsx` to:

1. **Remove the `pattern` attribute** -- eliminates the browser's native format check entirely, since we handle validation ourselves.
2. **Remove `required` from the native input** -- prevents the browser from running its own required-field check. Instead, validation is handled by the parent form's `handleSubmit` logic (which already checks the regex before submitting).
3. **Update the error message** to: "Enter a valid 10-digit Indian mobile number".

No changes are needed to `RequestHelp.tsx` or `JoinPartner.tsx` -- both already validate the phone number in their `handleSubmit` handlers before allowing submission.

### Technical Details

**File: `src/components/IndianPhoneInput.tsx`**

- Line 39: Remove `required={required}`
- Line 42: Remove `pattern="[0-9]*"`
- Line 51: Update error text to "Enter a valid 10-digit Indian mobile number"

The existing custom validation logic (`/^[6-9]\d{9}$/` regex, touch state, `handleSubmit` guards) remains unchanged and continues to enforce all rules.

