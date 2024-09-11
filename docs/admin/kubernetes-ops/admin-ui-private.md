---
tags:
  - administration
  - kubernetes
  - operations
  - private
  - internal
  - admin-ui
---

## Overview

This document demonstrates a method to override the URLs in the admin-ui used to connect to the backend services, such as the config API. 
This way the calls are made privately without hitting the FQDN through the internet.


## Configuration

1. We will install nginx in `ingress-nginx` namespace using the following command:
   `helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx`
    and thus, the svc is accessible at `ingress-nginx-controller.ingress-nginx.svc.cluster.local`

1.  Modify `values.yaml`:

    ```yaml
    admin-ui:
      usrEnvs:
        normal:
          CN_CONFIG_API_BASE_URL: https://ingress.local:8443
          CN_AUTH_BASE_URL: https://ingress.local:8443
          CN_TOKEN_SERVER_BASE_URL: https://ingress-nginx-controller.ingress-nginx.svc.cluster.local
    
    config-api:
      usrEnvs:
        normal:
          CN_TOKEN_SERVER_BASE_URL: https://ingress-nginx-controller.ingress-nginx.svc.cluster.local
    
    nginx-ingress:
      ingress:
        hosts:
          - demoexample.gluu.org # adjust Gluu FQDN used as needed
          - ingress-nginx-controller.ingress-nginx.svc.cluster.local
          - ingress.local
    ```

1.  Deploy the flex helm chart using the updated `values.yaml`

1.  To allow the browser to access internal service, add an entry inside `/etc/hosts` file:

    ```
    127.0.0.1 ingress.local
    <LB-External-IP> ingress-nginx-controller.ingress-nginx.svc.cluster.local
    ```
    
1.  By default, the `ingress-nginx-controller` deployment uses fake certificate generated by k8s. Add a new certificate (self-signed certificate and key are sufficient) as the default certificate into the ingress controller.

    1.  Generate SSL cert and key using your preferred tool. Make sure to add domain `ingress-nginx-controller.ingress-nginx.svc.cluster.local` and `ingress.local` in SAN section.

        Example:

        ```
        openssl req -x509 -newkey rsa:4096 -sha256 -days 365 -nodes -keyout ingress.local.key -out ingress.local.crt -subj "/CN=ingress.local" -addext "subjectAltName=DNS:ingress.local,DNS:ingress-nginx-controller.ingress-nginx.svc.cluster.local"
        ```
    
    1.  Create secrets to store the certificate and key, for example:

        ```sh
        kubectl -n <namespace> create secret tls internal-tls-certificate --cert /path/to/cert --key /path/to/key
        ```
        
    1.  Modify the `ingress-nginx-controller` deployment:

        ```yaml
        apiVersion: apps/v1                                       
        kind: Deployment                         
        metadata:
          name: ingress-nginx-controller
          namespace: ingress-nginx
        spec:
          template:
            spec:
              containers:
                - args:
                  # some arguments are omitted
                  # add a new argument to load self-signed cert
                  - --default-ssl-certificate=<namespace>/internal-tls-certificate
        ```
        
    1.  Rollout restart the `ingress-nginx-controller` deployment.

1.  Expose the service IP (port 443) to host (port 8443):

    ```
    kubectl -n ingress-nginx port-forward svc/ingress-nginx-controller 8443:443 &
    ```
    


1.  __OPTIONAL__: if the K8s cluster is deployed at a remote VM, make SSH tunneling before accessing the admin-ui web:

    ```
    ssh -N -L 8443:localhost:8443 <user>@<remote-vm> &
    ```
    
1.  Hit `https://ingress.local:8443` and allow the browser to skip certificate validation.

1.  Visit `https://<Gluu-FQDN>/admin`