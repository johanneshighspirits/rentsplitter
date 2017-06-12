class ProjectsController < ApplicationController

  include SessionsHelper
  include ProjectsHelper

  before_action :logged_in_member

  def index
    @projects = current_member.projects
  end

  def new
    @project = Project.new
  end

  def create
    new_project = current_member.projects.build(project_params)
    if current_member.save
      # Set join and left dates
      membership = current_member.memberships.where(project_id: new_project.id).first
      membership.joined_at = new_project.start_date
      membership.left_at = 100.years.from_now
      membership.save
      if new_project.reload.rents.empty?
        new_project.rents.create(amount: params[:monthly_rent], due_date: new_project.start_date.change(day: 25))
      end
      flash[:success] = "'#{new_project.name}' successfully created."
      # Open new Project
      set_current_project_id new_project.id
      # Invite/add members
      redirect_to invite_path
    else
      flash[:danger] = "Could not save new Project."
      @project = Project.new
      redirect_to new_project_path
    end
  end

  def edit
  end

  def show
    current_member.open_project params[:id]
    redirect_to root_path
  end

  def destroy
    @project = Project.find(params[:id])
    if is_admin_for_project? @project
      flash[:success] = "#{@project.name} deleted"
      @project.destroy
    else
      flash[:danger] = "Only members with admin privileges can delete projects."
    end
    redirect_to projects_path
  end

  def send_invoices
    @project = Project.find(params[:id])
    if is_admin_for_project? @project
      project_rents_and_discounts = @project.project_rents_and_discounts
      invoice_count = 0
      @project.members.each do |member|
        if member.activated
          membership = member.memberships.where(project_id: @project.id).first
          info = {
            sender: current_member,
            project: @project
          }
          puts "________________________\n|    Sending invoice to:\n|    === #{member.name} ===\n|    who joined at #{membership.joined_at}"
          rent_total = project_rents_and_discounts[:rents].inject(0) do |sum, r|
            if r[:to] < membership.joined_at
              sum
            else
              sum + r[:sharedAmount]
            end
          end
          puts "|    Total rent: #{rent_total}:-"
          discount_total = project_rents_and_discounts[:discounts].inject(0) do |sum, d|
            if d[:to] < membership.joined_at
              sum
            else
              sum + d[:sharedAmount]
            end
          end
          puts "|    Total discount: #{discount_total}:-"
          paid_total = membership.transfers.sum(:amount)
          puts "|    Paid #{paid_total}:-"
          debt = rent_total - discount_total - paid_total
          puts "|    #{member.name} must pay #{debt}:-\n________________________\n"
          info[:debt] = debt
          info[:due_date] = Date.current.end_of_month
          info[:account_info] = @project.account_info
          member.send_invoice_email info
          invoice_count += 1
        else
          flash[:info] = "Ignored unactivated member: #{member.name}."
          puts "Ignored unactivated member: #{member.name}."
        end
      end
      @project.update(invoices_sent_at: Time.now)
      flash[:success] = "#{invoice_count} #{'invoice'.pluralize(invoice_count)} sent"
    else
      flash[:danger] = "Only members with admin privileges can send invoices."
    end

    respond_to do |format|
      format.html { redirect_to projects_path }
      format.js {
        @response = { 
          selector: "send_invoices",
          btn_text: "Invoices sent",
          disable: true
        }
        render 'application/ajax_success' 
      }
    end

  end

  # Returns a member's project(s)
  def for_member
    projects_for_member = Member.find(params[:id]).projects.map { |p| [p.id, p.name] }
    projects_for_member.unshift([0, "Choose Member"]) if projects_for_member.count > 1
    render json: projects_for_member
  end


end
