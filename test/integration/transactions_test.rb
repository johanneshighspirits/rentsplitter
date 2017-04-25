require 'test_helper'

class TransactionsTest < ActionDispatch::IntegrationTest

  def setup
    @admin = members(:admin)
    @member = members(:member)
  end

  test "should save multiple transactions at once if admin" do
    # not logged_in
    get new_transaction_path
    assert_redirected_to login_path
    follow_redirect!
    assert_template 'sessions/new'
    # log in as member
    log_in_as @member
    get new_transaction_path
    assert_redirected_to root_path
    follow_redirect!
    assert_template 'application/index'
    log_out
    # log in as admin
    log_in_as @admin
    get new_transaction_path
    assert_response :success
    transactions = [
      {
        transaction: {
          amount: 250.0,
          message: "Test transaction",
          date: Time.zone.now.to_date
        }
      },
      {
        transaction: {
          amount: 123.5,
          message: "Test transaction again",
          date: Time.zone.now
        },
      }
    ]
    assert_difference 'Transaction.count', 2 do
      post transactions_many_path, params: { transactions: transactions }
    end
  end

end
