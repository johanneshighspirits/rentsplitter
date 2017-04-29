class Project < ApplicationRecord
  has_many :transactions
  has_many :members, through: :transactions
end
