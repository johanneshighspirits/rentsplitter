Rails.application.routes.draw do
  root 'application#index'

  get     '/login',   to: 'sessions#new'
  post    '/login',   to: 'sessions#create'
  delete  '/logout',  to: 'sessions#destroy'

  get     '/members/:id/projects', to: 'projects#for_member'
  get     '/projects/:id/transfers', to: 'transfers#for_project'
  post    '/transfers/many', to: 'transfers#create_many'

  resources :members
  resources :projects, only: [:index]
  resources :transfers
  resources :invitations, only: [:edit]

end
