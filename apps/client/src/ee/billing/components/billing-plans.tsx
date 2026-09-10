import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Flex,
  Group,
  List,
  Select,
  Stack,
  Switch,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconCheck, IconInfoCircle } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useBillingPlans } from "@/ee/billing/queries/billing-query.ts";
import { getCheckoutLink } from "@/ee/billing/services/billing-service.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom";

export default function BillingPlans() {
  const { data: plans } = useBillingPlans();
  const workspace = useAtomValue(workspaceAtom);
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedTierValue, setSelectedTierValue] = useState<string | null>(
    null
  );

  const handleCheckout = async (priceId: string) => {
    try {
      const checkoutLink = await getCheckoutLink({
        priceId,
      });
      window.location.href = checkoutLink.url;
    } catch (err) {
      console.error("Failed to get checkout link", err);
    }
  };

  // TODO: remove by July 30.
  // Check if workspace was created between June 28 and July 14, 2025
  const showTieredPricingNotice = (() => {
    if (!workspace?.createdAt) {
      return false;
    }
    const createdDate = new Date(workspace.createdAt);
    const startDate = new Date("2025-06-20");
    const endDate = new Date("2025-07-14");
    return createdDate >= startDate && createdDate <= endDate;
  })();

  if (!plans || plans.length === 0) {
    return null;
  }

  // Check if any plan is tiered
  const hasTieredPlans = plans.some(
    (plan) => plan.billingScheme === "tiered" && plan.pricingTiers?.length > 0
  );
  const firstTieredPlan = plans.find(
    (plan) => plan.billingScheme === "tiered" && plan.pricingTiers?.length > 0
  );

  // Set initial tier value if not set and we have tiered plans
  if (hasTieredPlans && !selectedTierValue && firstTieredPlan) {
    setSelectedTierValue(firstTieredPlan.pricingTiers[0].upTo.toString());
    return null;
  }

  // For tiered plans, ensure we have a selected tier
  if (hasTieredPlans && !selectedTierValue) {
    return null;
  }

  const selectData =
    firstTieredPlan?.pricingTiers
      ?.filter((tier) => !tier.custom)
      .map((tier, index) => {
        const prevMaxUsers =
          index > 0 ? firstTieredPlan.pricingTiers[index - 1].upTo : 0;
        return {
          label: `${prevMaxUsers + 1}-${tier.upTo} users`,
          value: tier.upTo.toString(),
        };
      }) || [];

  return (
    <Container py="xl" size="xl">
      {/* Tiered pricing notice for eligible workspaces */}
      {showTieredPricingNotice && !hasTieredPlans && (
        <Alert
          color="blue"
          icon={<IconInfoCircle size={16} />}
          mb="lg"
          title="Want the old tiered pricing?"
        >
          Contact support to switch back to our tiered pricing model.
        </Alert>
      )}

      {/* Controls Section */}
      <Stack gap="xl" mb="md">
        {/* Team Size and Billing Controls */}
        <Group align="center" gap="sm" justify="center">
          {hasTieredPlans && (
            <Select
              allowDeselect={false}
              data={selectData}
              description="Select the number of users"
              label="Team size"
              onChange={(value) => setSelectedTierValue(value)}
              size="md"
              value={selectedTierValue}
              w={250}
            />
          )}

          <Group align="start" justify="center">
            <Flex align="center" gap="md" justify="center">
              <Text size="md">Monthly</Text>
              <Switch
                defaultChecked={isAnnual}
                onChange={(event) => setIsAnnual(event.target.checked)}
                size="sm"
              />
              <Text size="md">
                Annually
                <Badge color="blue" component="span" variant="light">
                  15% OFF
                </Badge>
              </Text>
            </Flex>
          </Group>
        </Group>
      </Stack>

      {/* Plans Grid */}
      <Group align="stretch" gap="lg" justify="center">
        {plans.map((plan, index) => {
          let price;
          let displayPrice;
          const priceId = isAnnual ? plan.yearlyId : plan.monthlyId;

          if (
            plan.billingScheme === "tiered" &&
            plan.pricingTiers?.length > 0
          ) {
            // Tiered billing logic
            const planSelectedTier =
              plan.pricingTiers.find(
                (tier) => tier.upTo.toString() === selectedTierValue
              ) || plan.pricingTiers[0];

            price = isAnnual
              ? planSelectedTier.yearly
              : planSelectedTier.monthly;
            displayPrice = isAnnual ? (price / 12).toFixed(0) : price;
          } else {
            // Per-unit billing logic
            const monthlyPrice = Number.parseFloat(plan.price?.monthly || "0");
            const yearlyPrice = Number.parseFloat(plan.price?.yearly || "0");
            price = isAnnual ? yearlyPrice : monthlyPrice;
            displayPrice = isAnnual
              ? (yearlyPrice / 12).toFixed(0)
              : monthlyPrice;
          }

          return (
            <Card
              key={plan.name}
              miw={300}
              p="xl"
              radius="lg"
              shadow="sm"
              style={{
                position: "relative",
              }}
              w={350}
              withBorder
            >
              <Stack gap="lg">
                {/* Plan Header */}
                <Stack gap="xs">
                  <Title order={3} size="h4">
                    {plan.name}
                  </Title>
                  {plan.description && (
                    <Text c="dimmed" size="sm">
                      {plan.description}
                    </Text>
                  )}
                </Stack>

                {/* Pricing */}
                <Stack gap="xs">
                  <Group align="baseline" gap="xs">
                    <Title order={1} size="h1">
                      ${displayPrice}
                    </Title>
                    <Text c="dimmed" size="lg">
                      {plan.billingScheme === "per_unit"
                        ? "per user/month"
                        : "per month"}
                    </Text>
                  </Group>
                  <Text c="dimmed" size="sm">
                    {isAnnual ? "Billed annually" : "Billed monthly"}
                  </Text>
                  {plan.billingScheme === "tiered" && plan.pricingTiers && (
                    <Text fw={500} size="md">
                      For{" "}
                      {plan.pricingTiers.find(
                        (tier) => tier.upTo.toString() === selectedTierValue
                      )?.upTo || plan.pricingTiers[0].upTo}{" "}
                      users
                    </Text>
                  )}
                </Stack>

                {/* CTA Button */}
                <Button fullWidth onClick={() => handleCheckout(priceId)}>
                  Subscribe
                </Button>

                {/* Features */}
                <List
                  icon={
                    <ThemeIcon radius="xl" size={20}>
                      <IconCheck size={14} />
                    </ThemeIcon>
                  }
                  size="sm"
                  spacing="xs"
                >
                  {plan.features.map((feature, featureIndex) => (
                    <List.Item key={featureIndex}>{feature}</List.Item>
                  ))}
                </List>
              </Stack>
            </Card>
          );
        })}
      </Group>
    </Container>
  );
}
