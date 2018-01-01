class Project < ApplicationRecord
  before_create :check_start_date

  has_many :memberships,      dependent: :destroy
  has_many :rents,            dependent: :destroy
  has_many :rent_discounts,   dependent: :destroy
  has_many :expenses,         dependent: :destroy
  has_many :calendar_events,  dependent: :destroy
  
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

    @bonus = bonus
    if @bonus.nil?
      @bonus = 0
    end

    result = {
      perQuarter: perQuarter,
      rents: [],
      discounts: [],
      bonus: @bonus
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

      if !rents[m + 1].nil? && date > rents[m + 1].due_date.change(day: 10)
        m += 1
      end

      rent_including_bonus = @bonus + rents[m].amount
      rent = {
        amount: rent_including_bonus,
        message: "Rent for #{date.next_month.month}/#{date.next_month.year}",
        numberOfMembers: month_members,
        sharedAmount: (rent_including_bonus / month_members).round(2),
        shortDate: (short_date date),
        longDate: date.to_s(:iso8601),
        from: date.next_month.beginning_of_month,
        to: date.next_month(2).beginning_of_month - 1.seconds,
      }

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
    end_month = Date.current.day < 10 ? Date.current.prev_month.end_of_month : Date.current.end_of_month
    if perQuarter
      # Rent is to be payed in advance every quarter
      remainder = Date.current.day < 10 ? Date.current.prev_month.month % 3 : Date.current.month % 3
      months_in_advance = 2 - remainder
      end_month = end_month + months_in_advance.months
    end

    if !end_date.nil? && end_date.past?
      # Project has an end date.
      puts "Project has an end date: #{end_date}"
      # An end date is the last day of the month when rent
      # should be paid.
      # If the project ends last of August, you will still
      # have access to the premise throughout September.
      end_month = end_date
    end
    (start_date.prev_month..end_month).select do |date|
      if date.day == date.end_of_month.day
        puts "Project month #{date.end_of_month}"
      end
      date.day == date.end_of_month.day
    end
  end

  def send_invoice_reminder_for_project_admin
    admin = Member.find(admin_id)
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

  def end_date
    self[:end_date] == self[:start_date] ? nil : self[:end_date]
  end

  def finish_project(last_month_to_pay_for)
    # 
    self[:end_date] = last_month_to_pay_for.prev_month.end_of_month
    save
  end

end
