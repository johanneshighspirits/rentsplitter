class Transaction < ApplicationRecord
  # attr_accessor :amount

  belongs_to :member
  default_scope -> { order(date: :desc) }
  validates :member_id, :amount, :message, :date, presence: true

end
