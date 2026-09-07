Feature: Manage the cart
  As a shopper
  I want to change quantities and drop lines
  So that the cart matches what I want to buy

  Scenario: Adjust quantities and remove a line
    When I quick-add "Earl Grey"
    And I quick-add "Chamomile"
    And I quick-add "Earl Grey" again
    Then the cart badge still says 2
    When I go to the cart
    Then the cart lists 2 lines
    When I add one more "Earl Grey"
    Then "Earl Grey" is quantity 2 for "$18.00"
    When I remove "Chamomile"
    Then only "Earl Grey" is left
    And the total is "$18.00"
