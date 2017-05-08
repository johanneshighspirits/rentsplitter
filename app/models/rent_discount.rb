class RentDiscount < ApplicationRecord
  belongs_to :project

  validates :amount, numericality: true
  validates :message, :transferred_at, :amount, presence: true
  validate :valid_transfer_date?

  private
    def valid_transfer_date?
      if project.nil? || transferred_at < project.start_date
        errors.add(:transferred_at, "can't be before Project start_date")
      end
    end
end
