class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  include SessionsHelper

  def index
    if logged_in?
      @current_member = current_member
      puts "Logged in as #{@current_member.name}"
      set_current_project_id @current_member.current_project_id
      if current_project_id == 0
        # Member is not associated with a Project yet
        redirect_to projects_path
      else
        @current_project = Project.find(current_project_id)
      end
    else
      redirect_to login_path
    end
  end

  def mail_report
    case params['event']
    when "bounce"
      process_bounce(params)
    when "spamreport"
      process_spam(params)
    end
    return 200
  end

  private
    def process_bounce(params)
      puts "MAIL BOUNCED:"
      p params
    end

    def process_spam(params)
      puts "MAIL REPORTED AS SPAM:"
      p params
    end

end
