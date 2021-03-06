import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useEffect
} from 'react';

import { api } from '../services/api';
import { database } from '../database';
import { User as ModelUser } from '../database/model/User';
import { Alert } from 'react-native';

interface User {
    id: string;
    user_id: string;
    email: string;
    name: string;
    driver_license: string;
    avatar: string;
    token: string;
}

interface SignInCredentials {
    email: string;
    password: string;
}

interface AuthContextData {
    user: User;
    signIn: (credentials: SignInCredentials) => Promise<void>;
    signOut: () => Promise<void>;
    updatedUser: (user: User) => Promise<void>;
    loading: boolean;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// diz que recebe um filho 'children'
function AuthProvider({ children }: AuthProviderProps) {
    const [data, setData] = useState<User>({} as User);
    const [loading, setLoading] = useState(true);

    async function signIn({ email, password }: SignInCredentials) {
        setLoading(true);
        console.log('1');
        try {
            const response = await api.post('/sessions', {
                email,
                password
            });

            if (response.data.message === "Email or password incorret!") {
                setLoading(false);

                return Alert.alert(
                    'Erro na autenticação',
                    'E-mail ou usuário inválido!'
                )
            }

            setLoading(false);

            const { token, user } = response.data;
            //axios permite adicionar no cabeçalho, toda vez que logar já guarda o token
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const userCollection = database.get<ModelUser>(`users`);
            await database.write(async () => {
                await userCollection.create((newUser) => {
                    newUser.user_id = user.id,
                        newUser.name = user.name,
                        newUser.email = user.email,
                        newUser.driver_license = user.driver_license,
                        newUser.avatar = user.avatar,
                        newUser.token = user.token
                })
            });

            // pego tudo que vem do usuario com ...user
            setData({ ...user, token });
        } catch (error) {
            setLoading(false);
            throw new Error(error); //irá lançar para quem chamou o erro e não trata aqui
        }
    }

    async function signOut() {
        console.log('aqui');
        try {
            const userCollection = database.get<ModelUser>(`users`);
            await database.write(async () => {
                const userSelected = await userCollection.find(data.id); //dados do banco
                await userSelected.destroyPermanently();
            });

            setData({} as User);

        } catch (error) {
            //lançar um error para ser tratado por quem chamou
            throw new Error(error);
        }
    }

    async function updatedUser(user: User) {
        try {
            const userCollection = database.get<ModelUser>('users');
            await database.write(async () => {
                const userSelected = await userCollection.find(user.id);
                await userSelected.update((userData) => {
                    userData.name = user.name,
                        userData.driver_license = user.driver_license,
                        userData.avatar = user.avatar
                });
            });

            setData(user);

        } catch (error) {
            throw new Error(error);
        }
    }

    useEffect(() => {
        async function loadUserData() {
            console.log('2');
            const userCollection = database.get<ModelUser>('users');
            const response = await userCollection.query().fetch();

            if (response.length > 0) {
                const userData = response[0]._raw as unknown as User; // forçar uma tipagem unknown as User;
                api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;

                setData(userData);
            }

            setLoading(false);
        }

        loadUserData();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user: data,
                signIn,
                signOut,
                updatedUser,
                loading
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

function useAuth(): AuthContextData {
    const context = useContext(AuthContext);

    return context;
}

export { AuthProvider, useAuth };