pipeline {
  agent {
    node {
      label 'DotNetCompiler'
    }

  }
  stages {
    stage('Build') {
      steps {
        dir('ChatGPT4NET')
        {
          script {
            def msbuild = tool name: 'msbuild-v17', type: 'msbuild'

            bat "\"${msbuild}\\MSBuild.exe\" /t:restore /p:RestorePAckagesConfig=true"
            bat "\"${msbuild}\\MSBuild.exe\" /v:m /clp:ErrorsOnly;Summary /p:Configuration=Release /p:Platform=\"Any CPU\" ChatGPT4NET.sln"
          }
        }
      }
    }

    stage('Sign') {
      steps {
		    copyArtifacts filter: '**/Cryptifix-x64-*.zip', fingerprintArtifacts: true, projectName: 'IntuiFace/master', selector: lastSuccessful(), target: 'cryptifix'
        script {
          def files = findFiles(glob: '**/Cryptifix-x64-*.zip')
          unzip zipFile: "cryptifix\\${files[0].name}", dir: 'cryptifix'
        }
		    bat "cryptifix\\Cryptifix.exe sign \"ChatGPT4NET\\ChatGPT4NET\\bin\\Release\" --LicenseEdition=FREE --IsAllowedByNonInteractivePlayer=false"
      }
    }

    stage('Package') {
      steps {
		    zip archive: true, dir: "ChatGPT4NET\\ChatGPT4NET\\bin\\Release", glob: '', zipFile: "ChatGPT4NET.zip"
      }
    }
	
    stage('Archive') {
      steps {
        archiveArtifacts 'ChatGPT4NET.zip'
      }
    }

  }
}