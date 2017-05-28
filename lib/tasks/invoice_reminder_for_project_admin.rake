
desc "Send email reminding Project Admin that invoices need to be sent"
task :invoice_reminder_for_project_admin => :environment do
  if Date.current.day == 25
    Project.find_each do |project|
      project.send_invoice_reminder_for_project_admin
    end
  end
end