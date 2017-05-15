require 'test_helper'

class RentDiscountTest < ActiveSupport::TestCase

  def setup
    @project = projects(:projectOne)
    @valid_discount = {
      amount: 3000,
      message: "Valid Discount",
      transferred_at: Date.current
    }
    @invalid_discount = {
      amount: 3000,
      message: "Invalid Discount",
      transferred_at: 20.years.ago
    }
  end

  test "valid transfer must have a project" do
    # Try without project
    assert_difference 'RentDiscount.count', 0 do
      discount = RentDiscount.new(@valid_discount)
      assert !discount.valid?, "Discount should be invalid"
    end
    # Try with project
    assert_difference 'RentDiscount.count', 1 do
      discount = @project.rent_discounts.build(@valid_discount)
      assert discount.valid?, "Discount should be valid"
      @project.save
    end
    assert @project.rent_discounts.count == 1
    @project.rent_discounts.destroy_all
    @project.save
  end

  test "transfer date must be after project start" do
    assert_difference 'RentDiscount.count', 0 do
      discount = @project.rent_discounts.build(@invalid_discount)
      assert !discount.valid?, "Discount should be invalid"
      @project.save
    end
  end
end
