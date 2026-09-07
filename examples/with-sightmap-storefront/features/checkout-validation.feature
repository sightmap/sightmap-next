Feature: Checkout validation
  As a shopper
  I want to be told what is wrong with my details
  So that I can fix them and still place the order

  Scenario: A bad email address blocks the order until corrected
    When I quick-add "Sencha"
    And I go to the cart
    And I proceed to checkout
    And I enter my shipping details with the email "not-an-email"
    And I try to place the order
    Then the order is not placed
    And the form rejects the "email" field
    When I correct the email to "ada@example.com"
    And I place the order
    Then order "ORD-1001" is confirmed for "$17.00" with Standard shipping
