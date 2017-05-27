class Project < ApplicationRecord
  before_create :check_start_date

  has_many :memberships,      dependent: :destroy
  has_many :rents,            dependent: :destroy
  has_many :rent_discounts,   dependent: :destroy
  
  has_many :members, through: :memberships
  has_many :transfers, through: :memberships

  # validates :admin_id, presence: true
  validates :name, uniqueness: { scope: :admin_id }

  def project_rents_and_discounts
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
      month_members = members_for_month date.next_month

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

      rent = {
        amount: rents[m].amount,
        message: "Rent for #{date.next_month.month}/#{date.next_month.year}",
        numberOfMembers: month_members,
        sharedAmount: (rents[m].amount / month_members).round(2),
        shortDate: (short_date date),
        longDate: date.to_s(:iso8601),
        from: date.next_month.beginning_of_month,
        to: date.next_month(2).beginning_of_month - 1.seconds,
      }
      if !rents[m + 1].nil? && date > rents[m + 1].due_date
        m += 1
      end

      rent
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
    end_month = Date.current.day < 25 ? Date.current.prev_month.end_of_month : Date.current.end_of_month
    (start_date.prev_month..end_month).select do |date|
      date.day == date.end_of_month.day
    end
  end

  def send_invoice_reminder_for_project_admin
    admin = Member.find(admin_id)
    puts "Project.send_invoice_reminder_for_project_admin"
    admin.send_invoice_reminder self
  end

  # def total_rent(from, to)
  #   rents.where("due_date > ?", from).sum(:amount)
  # end

  # Returns sum of all discounts during a member's membership
  # Please note that discounts transferred in February only is
  # valid for member's who paid rent in January. So a member
  # that joins in February (from = 2017-02-01) will only get
  # discounts that are transferred after March 1st (2017-03-01)
  # def total_discount(from = start_date, to = Date.current)
  #   rent_discounts.where("transferred_at >= ? AND transferred_at <= ?", from.next_month, to).sum(:amount)
  # end

  def check_start_date
    self.start_date = Date.current.beginning_of_month.next_month if start_date.nil?
  end

end
