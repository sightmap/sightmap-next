Feature: Coupons
  As a shopper
  I want to apply a discount code
  So that I pay less

  Scenario: A valid code discounts, a bogus one is refused
    When I quick-add "Hand grinder"
    And I go to the cart
    And I apply the code "BOGUS"
    Then it is refused and the total is still "$89.00"
    When I apply the code "SAVE10"
    Then 10% is taken off, for a total of "$80.10"
    When I apply the code "WELCOME5"
    Then it replaces the last one: "$5.00" off, for a total of "$84.00"
