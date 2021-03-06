class Rent < ApplicationRecord
  belongs_to :project

  validates :amount, presence: true, numericality: true
  validates :due_date, presence: true

  default_scope { order('due_date') }

end
