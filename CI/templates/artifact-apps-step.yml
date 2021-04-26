# For now just a simple squeleton needs proper setting for deployment to ui test env
parameters:
- name: runID
  type: string
  default: ''

steps:
  - script: 'npm run artifact --buildID=${{ parameters.runID }} --buildsPath="$(System.DefaultWorkingDirectory)/builds/"'
    workingDirectory: 'CI/templates'
