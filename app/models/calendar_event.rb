class CalendarEvent < ApplicationRecord
  belongs_to :member
  belongs_to :project
  
  validate :to_must_be_later_than_from
  
  def to_must_be_later_than_from
    if from >= to 
      errors.add(:to, "must be later than from")
    end
  end
  
end
