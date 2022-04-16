import React, { useState } from 'react';
import { TextInputProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components';

// BorderlessButton botão quie não tem borda e nem fundo
import { BorderlessButton } from 'react-native-gesture-handler';

import {
  Container,
  IconContainer,
  InputText
} from './styles';

interface Props extends TextInputProps{
  iconName: React.ComponentProps<typeof Feather>['name'] //['name'] especifia que só quer o nome
  value?: string;
}

export function PasswordInput({
  iconName,
  value,
  ...rest
} : Props) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isFilled, setIsFilled] = useState(false);

  const theme = useTheme();

  function handleInputFocus(){
    setIsFocused(true);
  }

  function handleInputBlur(){
    setIsFocused(false);
    setIsFilled(!!value);//tem conteudo, fica verdadeiro, se não tem, fica falso
  }

  function handlePasswordVisibilityChange(){
    // prevState poderia ser qualquer nome, pega o valor atual e inverte
    setIsPasswordVisible(prevState => !prevState);
  }

  return (
    <Container isFocused={isFocused}>
      <IconContainer>
        <Feather 
          name={iconName}
          size={24}
          color={(isFocused || isFilled) ? theme.colors.main : theme.colors.text_detail}
        />
      </IconContainer>

      <InputText
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        secureTextEntry={isPasswordVisible}
        {...rest}
       />

      <BorderlessButton onPress={handlePasswordVisibilityChange} >
        <IconContainer>
          <Feather 
            name={isPasswordVisible ? 'eye' : 'eye-off'}
            size={24}
            color={theme.colors.text_detail}
          />
        </IconContainer>
      </BorderlessButton>
    </Container>
  );
}