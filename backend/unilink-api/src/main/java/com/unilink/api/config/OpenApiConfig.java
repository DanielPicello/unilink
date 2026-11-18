package com.unilink.api.config;

import org.springframework.context.annotation.Configuration;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "UniLink API",
                version = "v1",
                description = """
                        Autenticação por sessão. Faça login em /auth/login;
                        o cookie JSESSIONID é enviado automaticamente nas chamadas seguintes.
                        Nas rotas protegidas a conta é inferida da sessão.
                        Use GET /auth/me para descobrir o id da conta autenticada.
                        """
        )
)
@SecurityScheme(
        name = "sessionAuth",
        type = SecuritySchemeType.APIKEY,
        in = SecuritySchemeIn.COOKIE,
        paramName = "JSESSIONID",
        description = "Cookie recebido no login"
)
public class OpenApiConfig {

}
