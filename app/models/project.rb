class Project < ApplicationRecord
  before_create :check_start_date

  has_many :memberships #, dependent: :destroy
  has_many :rents
  has_many :members, through: :memberships
  has_many :transfers, through: :memberships

  validates :name, uniqueness: { scope: :admin_id }

  def check_start_date
    self.start_date = Date.current.beginning_of_month.next_month if start_date.nil?
  end

end
