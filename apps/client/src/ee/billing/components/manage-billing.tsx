import { Button, Group, Text } from "@mantine/core";
import { getBillingPortalLink } from "@/ee/billing/services/billing-service.ts";

export default function ManageBilling() {
  const handleBillingPortal = async () => {
    try {
      const portalLink = await getBillingPortalLink();
      window.location.href = portalLink.url;
    } catch (err) {
      console.error("Failed to get billing portal link", err);
    }
  };

  return (
    <>
      <Group gap="xl" justify="space-between" wrap="wrap">
        <div style={{ flex: 1, minWidth: "200px" }}>
          <Text fw={500} size="md">
            Manage subscription
          </Text>
          <Text c="dimmed" size="sm">
            Manage your your subscription, invoices, update payment details, and
            more.
          </Text>
        </div>

        <Button onClick={handleBillingPortal} style={{ flexShrink: 0 }}>
          Manage
        </Button>
      </Group>
    </>
  );
}
