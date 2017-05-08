class Rent < ApplicationRecord
  belongs_to :project

  validates :amount, presence: true, numericality: true
  validates :due_date, presence: true

end
