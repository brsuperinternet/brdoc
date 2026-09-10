import { Alert } from "@mantine/core";

export default function BillingIncomplete() {
  return (
    <>
      <Alert color="blue" variant="light">
        Your subscription is in an incomplete state. Please refresh this page if
        you recently made your payment.
      </Alert>
    </>
  );
}
