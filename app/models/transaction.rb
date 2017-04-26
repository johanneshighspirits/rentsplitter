class Transaction < ApplicationRecord
  # attr_accessor :amount

  validates :member_id, :amount, :message, :date, presence: true
  belongs_to :member

end
