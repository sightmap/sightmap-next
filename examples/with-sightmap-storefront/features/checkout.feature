Feature: Checkout
  As a shopper
  I want to place an order
  So that I get my coffee gear

  Scenario: Place an order with express shipping
    When I quick-add "Ceramic dripper"
    And I go to the cart
    And I apply the code "WELCOME5"
    And I proceed to checkout
    And I enter my shipping details as Ada Lovelace, ada@example.com, 12 Analytical Way, London N1 9GU
    And I choose Express shipping
    Then the summary shows subtotal "$24.00", discount "−$5.00", shipping "$15.00", total "$34.00"
    When I place the order
    Then order "ORD-1001" is confirmed for "$34.00", shipped Express to my address
    And it lists one "Ceramic dripper"
    When I view my order history
    Then "ORD-1001" is the only order, 1 item, "$34.00"
    When I open "ORD-1001"
    Then I am back on its confirmation
