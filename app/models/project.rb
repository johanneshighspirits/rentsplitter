class Project < ApplicationRecord
  before_create :check_start_date

  has_many :memberships,      dependent: :destroy
  has_many :rents,            dependent: :destroy
  has_many :rent_discounts,   dependent: :destroy
  
  has_many :members, through: :memberships
  has_many :transfers, through: :memberships

  # validates :admin_id, presence: true
  validates :name, uniqueness: { scope: :admin_id }

  # def total_rent
  #   rents.sum(:amount)
  # end

  def project_rents_and_discounts
    @project_members = members.includes(:memberships)

    @membership_ranges = memberships.inject([]) do |ranges, membership|
      ranges << (membership.joined_at..membership.left_at)
    end

    project_discounts = rent_discounts.inject({}) do |discounts, discount|
      key = "#{discount.transferred_at.year}#{discount.transferred_at.month}"
      if discounts[key].nil?
        discounts[key] = [discount]
      else
        discounts[key] << discount
      end
      discounts
    end

    result = {
      rents: [],
      discounts: [],
    }
    # Loop through all project's months and add the rent to project_rents
    m = 0
    result[:rents] = project_months.map do |date|

      if !rents[m + 1].nil? && date > rents[m + 1].due_date
        m += 1
      end
      month_members = members_for_month date

      unless project_discounts["#{date.year}#{date.month}"].nil?
        result[:discounts].concat(
          project_discounts["#{date.year}#{date.month}"].map do |discount|
            {
              amount: discount.amount,
              message: discount.message,
              sharedAmount: (discount.amount / month_members).round(2),
              shortDate: (short_date discount.transferred_at),
              longDate: discount.transferred_at.to_s(:iso8601),
              from: discount.transferred_at.prev_month.beginning_of_month.midnight,
              to: discount.transferred_at.beginning_of_month.midnight - 1.seconds,             
            }
          end
        )
      end


      {
        amount: rents[m].amount,
        message: "Rent for #{date.month}/#{date.year}",
        numberOfMembers: month_members,
        sharedAmount: (rents[m].amount / month_members).round(2),
        shortDate: (short_date date),
        longDate: date.to_s(:iso8601),
        from: date.next_month.beginning_of_month,
        to: date.next_month(2).beginning_of_month - 1.seconds,
      }    
    end
    result

  end

  def short_date(date)
    "#{date.day}/#{date.month}"
  end

  def members_for_month(date)
    @membership_ranges.inject(0) do |sum, range|
      sum += 1 if range.include? date
      sum
    end
  end

  def project_months
    (start_date.prev_month..Date.current.end_of_month).select do |date|
      date.day == date.end_of_month.day
    end
  end

  def total_discount
    rent_discounts.sum(:amount)
  end

  def check_start_date
    self.start_date = Date.current.beginning_of_month.next_month if start_date.nil?
  end

end
