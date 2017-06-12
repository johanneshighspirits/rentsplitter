class MailReportsController < ActionController::Base
  protect_from_forgery with: :null_session
  skip_before_action :verify_authenticity_token, only: [:mail_report]

  def mail_report
    case params['event']
    when "bounce"
      process_bounce(params)
    when "spamreport"
      process_spam(params)
    end
    head :ok
  end

  private
    def process_bounce(params)
      project = Project.find(params[:unique_args][:project_id])
      project_admin = Member.find(project.admin_id)
      MemberMailer.information(project_admin, "#{params[:category]} email bounced", ["#{params[:category]} email bounced for #{params[:email]}.","Reason: #{params[:reason]}"])
      puts "Sent information mail to #{project_admin.name}, info: #{params[:email]} bounced."
    end

    def process_spam(params)
      project = Project.find(params[:unique_args][:project_id])
      project_admin = Member.find(project.admin_id)
      MemberMailer.information(project_admin, "#{params[:category]} email reported as spam", ["#{params[:category]} email reported as spam by #{params[:email]}."])
      puts "Sent information mail to #{project_admin.name}, info: #{params[:email]} reported as spam."
    end

end
