class Project < ApplicationRecord
  before_create :check_start_date

  has_many :memberships #, dependent: :destroy
  has_many :rents
  has_many :rent_discounts
  has_many :members, through: :memberships
  has_many :transfers, through: :memberships

  validates :admin_id, presence: true
  validates :name, uniqueness: { scope: :admin_id }

  def total_rent
    rents.sum(:amount)
  end

  def total_discount
    rent_discounts.sum(:amount)
  end

  def check_start_date
    self.start_date = Date.current.beginning_of_month.next_month if start_date.nil?
  end

end
