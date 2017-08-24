class CalendarEvent < ApplicationRecord
  belongs_to :member
  belongs_to :project
  
  validate :to_date_must_be_later_than_from_date
  
  def to_date_must_be_later_than_from_date
    if from_date >= to_date 
      errors.add(:to_date, "must be later than from_date")
    end
  end
  
end
