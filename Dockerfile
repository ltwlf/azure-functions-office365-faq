FROM leitwolf/azure-functions-node

COPY . /home/site/wwwroot

ENV AzureWebJobsSecretStorageType=files

WORKDIR /home/site/wwwroot